import 'package:get_it/get_it.dart';
import 'package:http/http.dart' as http;

import 'core/network/api_result.dart';
import 'core/session/session_store.dart';

import 'features/payments/data/datasources/payment_remote_data_source.dart';
import 'features/payments/data/repositories/payment_repository_impl.dart';
import 'features/payments/domain/repositories/payment_repository.dart';
import 'features/payments/domain/usecases/get_payments.dart';
import 'features/payments/domain/usecases/refund_booking.dart';
import 'features/payments/presentation/bloc/payments_bloc.dart';

import 'features/bookings/data/datasources/booking_remote_data_source.dart';
import 'features/bookings/data/repositories/booking_repository_impl.dart';
import 'features/bookings/domain/repositories/booking_repository.dart';
import 'features/bookings/domain/usecases/get_booking_detail.dart';
import 'features/bookings/domain/usecases/booking_usecases.dart';
import 'features/bookings/presentation/bloc/bookings_bloc.dart';
import 'features/bookings/presentation/bloc/new_booking_bloc.dart';

import 'features/enquiries/data/datasources/enquiry_remote_data_source.dart';
import 'features/enquiries/data/repositories/enquiry_repository_impl.dart';
import 'features/enquiries/domain/repositories/enquiry_repository.dart';
import 'features/enquiries/domain/usecases/get_enquiries.dart';
import 'features/enquiries/domain/usecases/reply_enquiry.dart';
import 'features/enquiries/presentation/bloc/enquiries_bloc.dart';

import 'features/safety/data/datasources/safety_remote_data_source.dart';
import 'features/safety/data/repositories/safety_repository_impl.dart';
import 'features/safety/domain/repositories/safety_repository.dart';
import 'features/safety/domain/usecases/safety_usecases.dart';
import 'features/safety/presentation/bloc/incidents_bloc.dart';
import 'features/safety/presentation/bloc/hazards_bloc.dart';

import 'features/comms/data/datasources/comms_remote_data_source.dart';
import 'features/comms/data/repositories/comms_repository_impl.dart';
import 'features/comms/domain/repositories/comms_repository.dart';
import 'features/comms/domain/usecases/comms_usecases.dart';
import 'features/comms/presentation/bloc/publish_bloc.dart';

import 'features/fleet/data/datasources/fleet_remote_data_source.dart';
import 'features/fleet/data/repositories/fleet_repository_impl.dart';
import 'features/fleet/domain/repositories/fleet_repository.dart';
import 'features/fleet/domain/usecases/fleet_usecases.dart';
import 'features/fleet/presentation/bloc/bikes_bloc.dart';
import 'features/fleet/presentation/bloc/equipment_bloc.dart';
import 'features/fleet/presentation/bloc/compliance_bloc.dart';
import 'features/fleet/presentation/bloc/readiness_bloc.dart';
import 'features/fleet/presentation/bloc/add_bike_bloc.dart';
import 'features/fleet/presentation/bloc/bike_allocation_bloc.dart';
import 'features/fleet/presentation/bloc/flagged_bike_bloc.dart';

import 'features/scheduling/data/datasources/scheduling_remote_data_source.dart';
import 'features/scheduling/data/repositories/scheduling_repository_impl.dart';
import 'features/scheduling/domain/repositories/scheduling_repository.dart';
import 'features/scheduling/domain/usecases/scheduling_usecases.dart';
import 'features/scheduling/presentation/bloc/tours_bloc.dart';
import 'features/scheduling/presentation/bloc/calendar_bloc.dart';
import 'features/scheduling/presentation/bloc/scheduler_bloc.dart';

import 'features/auth/data/datasources/auth_remote_data_source.dart';
import 'features/auth/data/repositories/auth_repository_impl.dart';
import 'features/auth/domain/repositories/auth_repository.dart';
import 'features/auth/domain/usecases/auth_usecases.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';

import 'features/settings/data/datasources/settings_remote_data_source.dart';
import 'features/settings/data/repositories/settings_repository_impl.dart';
import 'features/settings/domain/repositories/settings_repository.dart';
import 'features/settings/domain/usecases/settings_usecases.dart';
import 'features/settings/presentation/bloc/settings_bloc.dart';

import 'features/email/data/datasources/email_remote_data_source.dart';
import 'features/email/data/repositories/email_repository_impl.dart';
import 'features/email/domain/repositories/email_repository.dart';
import 'features/email/domain/usecases/email_usecases.dart';
import 'features/email/presentation/bloc/archive_bloc.dart';
import 'features/email/presentation/bloc/templates_bloc.dart';

/// Service locator. `main()` calls [configureDependencies] once at startup.
/// Registration order: external → core → per-feature (data → domain → bloc).
/// Each feature adds one `_register<Feature>()` block as it is migrated.
final GetIt sl = GetIt.instance;

void configureDependencies() {
  // ---- external -----------------------------------------------------------
  sl.registerLazySingleton<http.Client>(() => http.Client());

  // ---- core ---------------------------------------------------------------
  sl.registerLazySingleton<SessionStore>(() => SessionStore());
  sl.registerLazySingleton<ApiHttp>(() => ApiHttp(
        httpClient: sl(),
        baseUrl: kApiBaseUrl,
        tokenProvider: () => sl<SessionStore>().token,
      ));

  // ---- features -----------------------------------------------------------
  _registerBookings();
  _registerPayments();
  _registerEnquiries();
  _registerSafety();
  _registerComms();
  _registerFleet();
  _registerScheduling();
  _registerAuth();
  _registerSettings();
  _registerEmail();
}

void _registerEmail() {
  sl.registerLazySingleton<EmailRemoteDataSource>(() => EmailRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<EmailRepository>(() => EmailRepositoryImpl(sl()));
  sl.registerLazySingleton(() => SearchArchive(sl()));
  sl.registerLazySingleton(() => GetThread(sl()));
  sl.registerLazySingleton(() => LinkThread(sl()));
  sl.registerLazySingleton(() => ReplyToThread(sl()));
  sl.registerLazySingleton(() => GetTemplates(sl()));
  sl.registerLazySingleton(() => SaveTemplate(sl()));
  sl.registerFactory(() => ArchiveBloc(sl()));
  sl.registerFactory(() => TemplatesBloc(sl()));
}

void _registerSettings() {
  sl.registerLazySingleton<SettingsRemoteDataSource>(() => SettingsRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<SettingsRepository>(() => SettingsRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetSettings(sl()));
  sl.registerLazySingleton(() => UpdateSettings(sl()));
  sl.registerFactory(() => SettingsBloc(getSettings: sl(), updateSettings: sl()));
}

void _registerAuth() {
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(sl(), sl()));
  sl.registerLazySingleton(() => SignIn(sl()));
  sl.registerLazySingleton(() => SignOut(sl()));
  // Singleton: one AuthBloc gates the whole app shell.
  sl.registerLazySingleton(() => AuthBloc(signIn: sl(), signOut: sl()));
}

void _registerScheduling() {
  sl.registerLazySingleton<SchedulingRemoteDataSource>(() => SchedulingRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<SchedulingRepository>(() => SchedulingRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetCalendar(sl()));
  sl.registerLazySingleton(() => GetDeparture(sl()));
  sl.registerLazySingleton(() => GetTours(sl()));
  sl.registerLazySingleton(() => SaveTour(sl()));
  sl.registerLazySingleton(() => DeleteTour(sl()));
  sl.registerLazySingleton(() => GetDepartures(sl()));
  sl.registerLazySingleton(() => GetGuides(sl()));
  sl.registerLazySingleton(() => SaveDeparture(sl()));
  sl.registerLazySingleton(() => CancelDeparture(sl()));
  sl.registerFactory(() => ToursBloc(sl()));
  sl.registerFactory(() => CalendarBloc(sl()));
  sl.registerFactory(() => SchedulerBloc(
      getDepartures: sl(), getGuides: sl(), getTours: sl(), saveDeparture: sl(), cancelDeparture: sl()));
}

void _registerFleet() {
  sl.registerLazySingleton<FleetRemoteDataSource>(() => FleetRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<FleetRepository>(() => FleetRepositoryImpl(sl()));
  // use cases
  sl.registerLazySingleton(() => GetFleet(sl()));
  sl.registerLazySingleton(() => GetBike(sl()));
  sl.registerLazySingleton(() => AddBike(sl()));
  sl.registerLazySingleton(() => GetFleetReadiness(sl()));
  sl.registerLazySingleton(() => GetAvailableBikes(sl()));
  sl.registerLazySingleton(() => SetBikeAssignments(sl()));
  sl.registerLazySingleton(() => LogMaintenance(sl()));
  sl.registerLazySingleton(() => SetBikeStatus(sl()));
  sl.registerLazySingleton(() => GetEquipment(sl()));
  sl.registerLazySingleton(() => AddEquipment(sl()));
  sl.registerLazySingleton(() => GetCompliance(sl()));
  sl.registerLazySingleton(() => RenewCompliance(sl()));
  sl.registerLazySingleton(() => GetDepartureOptions(sl()));
  // blocs
  sl.registerFactory(() => BikesBloc(getFleet: sl(), getBike: sl()));
  sl.registerFactory(() => EquipmentBloc(getEquipment: sl(), addEquipment: sl()));
  sl.registerFactory(() => ComplianceBloc(getCompliance: sl(), renewCompliance: sl()));
  sl.registerFactory(() => ReadinessBloc(sl()));
  sl.registerFactory(() => AddBikeBloc(getFleet: sl(), addBike: sl()));
  sl.registerFactory(() => BikeAllocationBloc(
      getDepartureOptions: sl(), getAvailableBikes: sl(), setBikeAssignments: sl()));
  sl.registerFactory(() => FlaggedBikeBloc(getFleet: sl(), logMaintenance: sl(), setBikeStatus: sl()));
}

void _registerComms() {
  sl.registerLazySingleton<CommsRemoteDataSource>(
      () => CommsRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<CommsRepository>(() => CommsRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetAlerts(sl()));
  sl.registerLazySingleton(() => GetDeliverability(sl()));
  sl.registerLazySingleton(() => GetAudit(sl()));
  sl.registerLazySingleton(() => GetContent(sl()));
  sl.registerLazySingleton(() => Publish(sl()));
  sl.registerFactory(() => PublishBloc(getContent: sl(), publish: sl()));
}

void _registerSafety() {
  sl.registerLazySingleton<SafetyRemoteDataSource>(
      () => SafetyRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<SafetyRepository>(() => SafetyRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetIncidents(sl()));
  sl.registerLazySingleton(() => DispatchIncident(sl()));
  sl.registerLazySingleton(() => GetHazards(sl()));
  sl.registerLazySingleton(() => ReviewHazard(sl()));
  sl.registerFactory(() => IncidentsBloc(getIncidents: sl(), dispatchIncident: sl()));
  sl.registerFactory(() => HazardsBloc(getHazards: sl(), reviewHazard: sl()));
}

void _registerEnquiries() {
  sl.registerLazySingleton<EnquiryRemoteDataSource>(
      () => EnquiryRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<EnquiryRepository>(() => EnquiryRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetEnquiries(sl()));
  sl.registerLazySingleton(() => ReplyEnquiry(sl()));
  sl.registerFactory(() => EnquiriesBloc(getEnquiries: sl(), replyEnquiry: sl()));
}

void _registerBookings() {
  sl.registerLazySingleton<BookingRemoteDataSource>(
      () => BookingRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<BookingRepository>(
      () => BookingRepositoryImpl(sl()));
  sl.registerLazySingleton(() => GetBookingDetail(sl()));
  sl.registerLazySingleton(() => GetBookings(sl()));
  sl.registerLazySingleton(() => GetBookingDepartures(sl()));
  sl.registerLazySingleton(() => CreateBooking(sl()));
  sl.registerLazySingleton(() => CreateProvisionalBooking(sl()));
  sl.registerLazySingleton(() => UpdateBooking(sl()));
  sl.registerLazySingleton(() => TransitionBooking(sl()));
  sl.registerFactory(() => BookingsBloc(getBookings: sl(), getBookingDetail: sl(), transitionBooking: sl()));
  sl.registerFactory(() => NewBookingBloc(getDepartures: sl(), createBooking: sl(), createProvisionalBooking: sl()));
}

void _registerPayments() {
  // data
  sl.registerLazySingleton<PaymentRemoteDataSource>(
      () => PaymentRemoteDataSourceImpl(sl()));
  sl.registerLazySingleton<PaymentRepository>(
      () => PaymentRepositoryImpl(sl()));
  // domain
  sl.registerLazySingleton(() => GetPayments(sl()));
  sl.registerLazySingleton(() => RefundBooking(sl()));
  // presentation — factory: a fresh Bloc per screen mount
  sl.registerFactory(() => PaymentsBloc(getPayments: sl(), refundBooking: sl()));
}

/// Base URL for the api-worker, overridable via --dart-define=API_BASE_URL=...
const String kApiBaseUrl =
    String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:8787');
